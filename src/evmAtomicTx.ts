import { BN } from '@flarenetwork/flarejs/dist'
import { EcdsaSignature } from '@flarenetwork/flarejs/dist/common'
import { UnsignedTx, Tx, UTXOSet } from '@flarenetwork/flarejs/dist/apis/evm'
import { costImportTx, costExportTx } from "@flarenetwork/flarejs/dist/utils"
import { SignedTxJson, UnsignedTxJson, Context } from './interfaces'
import {
  expandSignature,
  serializeExportCP_args, deserializeExportCP_args, deserializeImportPC_args,
  serializeImportPC_args
} from './utils'

type ExportCPParams = [BN, string, string, string, string, string[], number, BN, number, BN]
type ImportPCParams = [UTXOSet, string, string[], string, string[], BN]

/**
 * Exports funds from C-chain to P-chain
 * @param ctx - context with constants initialized from user keys
 * @param amount - amount to export from C-chain to P-chain
 * @param fee - export transaction fee
 * @param nonce - export transaction nonce
 */
export async function exportTxCP(
  ctx: Context, amount: BN, fee?: BN, nonce?: number, threshold?: number
): Promise<{ txid: string, usedFee: string }> {
  const params = await getExportCPParams(ctx, amount, fee, nonce, threshold)
  console.log(params)
  const unsignedTx: UnsignedTx = await ctx.cchain.buildExportTx(...params)
  const blockchainId = await ctx.cchain.getBlockchainID()
  const tx: Tx = unsignedTx.sign(ctx.cKeychain)
  console.log(tx)
  const txid = await ctx.cchain.issueTx(tx)
  const usedFee = params[9].toString()
  return { txid: txid, usedFee: usedFee }
}

/**
 * Import funds exported from P-chain to C-chain.
 * @param ctx - context with constants initialized from user keys
 * @param fee - import transaction fee
 */
export async function importTxPC(
  ctx: Context, fee?: BN
): Promise<{ txid: string, usedFee: string }> {
  const params = await getImportPCParams(ctx, fee)
  let unsignedTx: UnsignedTx = await ctx.cchain.buildImportTx(...params)
  const tx: Tx = unsignedTx.sign(ctx.cKeychain)
  const txid: string = await ctx.cchain.issueTx(tx)
  const usedFee = params[5].toString()
  return { txid: txid, usedFee: usedFee }
}

/**
 * Get hashes that need to get signed in order for funds to be
 * exported from P-chain to C-chain to C-chain.
 * @param ctx - context with constants initialized from user keys
 * @param amount - amount to export from C-chain to P-chain
 * @param fee - export transaction fee
 * @param nonce - export transaction nonce
 */
export async function getUnsignedExportTxCP(
  ctx: Context, amount: BN, fee?: BN, nonce?: number, threshold?: number
): Promise<UnsignedTxJson> {
  const params = await getExportCPParams(ctx, amount, fee, nonce, threshold)
  const unsignedTx = await ctx.cchain.buildExportTx(...params)
  return {
    transactionType: 'exportCP',
    serialization: serializeExportCP_args(params),
    signatureRequests: unsignedTx.prepareUnsignedHashes(ctx.cKeychain),
    unsignedTransactionBuffer: unsignedTx.toBuffer().toString('hex'),
    usedFee: params[9]!.toString()
  }
}

/**
 * Generate unsigned import transaction from P-chain to C-chain.
 * @param ctx - context with constants initialized from user keys
 * @param fee - import transaction fee
 */
export async function getUnsignedImportTxPC(
  ctx: Context, fee?: BN
): Promise<UnsignedTxJson> {
  const params = await getImportPCParams(ctx, fee)
  let unsignedTx: UnsignedTx = await ctx.cchain.buildImportTx(...params)
  return {
    transactionType: 'importPC',
    serialization: serializeImportPC_args(params),
    signatureRequests: unsignedTx.prepareUnsignedHashes(ctx.cKeychain),
    unsignedTransactionBuffer: unsignedTx.toBuffer().toString('hex'),
    usedFee: params[5].toString()
  }
}

/**
 * Issue a transaction to export funds from C-chain to P-chain
 * @param ctx - context with constants initialized from user keys
 * @param signedTxJson - signed transaction
 */
export async function issueSignedEvmTxCPExport(ctx: Context, signedTxJson: SignedTxJson): Promise<{ chainTxId: string }> {
  return issueSignedEvmTx(ctx, signedTxJson, async (serialization: string) =>
    ctx.cchain.buildExportTx(...deserializeExportCP_args(serialization)))
}

/**
 * Issue a transaction to import funds from P-chain
 * @param ctx - context with constants initialized from user keys
 * @param signedTxJson - signed transaction
 */
export async function issueSignedEvmTxPCImport(ctx: Context, signedTxJson: SignedTxJson): Promise<{ chainTxId: string }> {
  return issueSignedEvmTx(ctx, signedTxJson, async (serialization: string) =>
    ctx.cchain.buildImportTx(...deserializeImportPC_args(serialization)))
}

async function issueSignedEvmTx(ctx: Context, signedTxJson: SignedTxJson,
    txBuilder: (serialization: string) => Promise<UnsignedTx>): Promise<{ chainTxId: string }> {
  const signatures = Array(signedTxJson.signatureRequests.length).fill(signedTxJson.signature)
  const ecdsaSignatures: EcdsaSignature[] = signatures.map((signature: string) => expandSignature(signature))
  const unsignedTx = await txBuilder(signedTxJson.serialization)
  const tx: Tx = unsignedTx.signWithRawSignatures(ecdsaSignatures, ctx.cKeychain)
  const chainTxId = await ctx.cchain.issueTx(tx)
  return { chainTxId: chainTxId }
}

async function getExportCPParams(ctx: Context, amount: BN, fee?: BN, nonce?: number, threshold: number = 1): Promise<ExportCPParams> {
  const txcount = await ctx.web3.eth.getTransactionCount(ctx.cAddressHex)
  const locktime: BN = new BN(0)
  const importFee: BN = ctx.pchain.getDefaultTxFee()
  const baseFeeResponse: string = await ctx.cchain.getBaseFee()
  const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9)
  const params: ExportCPParams = [
    amount.add(importFee),
    ctx.avaxAssetID,
    ctx.pChainBlockchainID,
    ctx.cAddressHex!,
    ctx.cAddressBech32!,
    [ctx.pAddressBech32!],
    nonce ?? txcount,
    locktime,
    threshold,
    fee ?? baseFee
  ]
  const unsignedTx: UnsignedTx = await ctx.cchain.buildExportTx(...params)
  if (fee === undefined) {
    const exportCost: number = costExportTx(unsignedTx)
    params[9] = baseFee.mul(new BN(exportCost))
  }
  return params
}

async function getImportPCParams(ctx: Context, fee?: BN): Promise<ImportPCParams> {
  const baseFeeResponse: string = await ctx.cchain.getBaseFee()
  const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9)
  const evmUTXOResponse: any = await ctx.cchain.getUTXOs(
    [ctx.cAddressBech32!],
    ctx.pChainBlockchainID
  )
  const utxoSet: UTXOSet = evmUTXOResponse.utxos
  const params: ImportPCParams = [
    utxoSet,
    ctx.cAddressHex!,
    [ctx.cAddressBech32!],
    ctx.pChainBlockchainID,
    [ctx.cAddressBech32!],
    baseFee
  ]
  const unsignedTx: UnsignedTx = await ctx.cchain.buildImportTx(...params)
  if (fee === undefined) {
    const importCost: number = costImportTx(unsignedTx)
    params[5] = baseFee.mul(new BN(importCost))
  }
  return params
}
