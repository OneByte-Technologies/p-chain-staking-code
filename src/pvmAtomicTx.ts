import { Context } from './constants'
import { SignData } from './interfaces'
import { expandSignature } from './utils'
import { EcdsaSignature } from '@flarenetwork/flarejs/dist/common'
import { BN, Buffer } from '@flarenetwork/flarejs/dist'
import { UTXOSet, UnsignedTx, Tx } from '@flarenetwork/flarejs/dist/apis/platformvm'
import { UnixNow } from '@flarenetwork/flarejs/dist//utils'

/**
 * Import funds exported from C-chain to P-chain to P-chain
 * @param ctx - context with constants initialized from user keys
 */
export async function importTxCP(ctx: Context): Promise<{ txid: string }> {
  const threshold = 1
  const locktime: BN = new BN(0)
  const memo: Buffer = Buffer.from(
    'PlatformVM utility method buildImportTx to import AVAX to the P-Chain from the C-Chain'
  )
  const asOf: BN = UnixNow()
  const platformVMUTXOResponse: any = await ctx.pchain.getUTXOs(
    [ctx.pAddressBech32!],
    ctx.cChainBlockchainID
  )
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const unsignedTx: UnsignedTx = await ctx.pchain.buildImportTx(
    utxoSet,
    [ctx.pAddressBech32!],
    ctx.cChainBlockchainID,
    [ctx.pAddressBech32!],
    [ctx.pAddressBech32!],
    [ctx.pAddressBech32!],
    memo,
    asOf,
    locktime,
    threshold
  )
  const tx: Tx = unsignedTx.sign(ctx.pKeychain)
  const txid: string = await ctx.pchain.issueTx(tx)
  return { txid: txid }
}

/**
 * Export funds from P-chain to C-chain.
 * @param ctx - context with constants initialized from user keys
 * @param amount - amount to export (if left undefined, it exports all funds on P-chain)
 */
export async function exportTxPC(ctx: Context, amount?: BN): Promise<{ txid: string }> {
  const threshold: number = 1
  const locktime: BN = new BN(0)
  const memo: Buffer = Buffer.from(
    "PlatformVM utility method buildExportTx to export AVAX from the P-Chain to the C-Chain"
  )
  const asOf: BN = UnixNow()
  const platformVMUTXOResponse: any = await ctx.pchain.getUTXOs([ctx.pAddressBech32!])
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const fee = ctx.pchain.getDefaultTxFee()

  if (amount === undefined) {
    const getBalanceResponse: any = await ctx.pchain.getBalance(ctx.pAddressBech32!)
    const unlocked = new BN(getBalanceResponse.unlocked)
    amount = unlocked.sub(fee)
  }

  const unsignedTx: UnsignedTx = await ctx.pchain.buildExportTx(
    utxoSet,
    amount,
    ctx.cChainBlockchainID,
    [ctx.cAddressBech32!],
    [ctx.pAddressBech32!],
    [ctx.pAddressBech32!],
    memo,
    asOf,
    locktime,
    threshold
  )
  const tx: Tx = unsignedTx.sign(ctx.pKeychain)
  const txid: string = await ctx.pchain.issueTx(tx)
  return { txid: txid }
}

/**
 * Get hashes that need to get signed in order for funds exported from
 * C-chain to P-chain to be imported to P-chain
 * @param ctx - context with constants initialized from user keys
 */
export async function importTxCP_unsignedHashes(ctx: Context): Promise<SignData> {
  const threshold = 1
  const locktime: BN = new BN(0)
  const memo: Buffer = Buffer.from(
    'PlatformVM utility method buildImportTx to import AVAX to the P-Chain from the C-Chain'
    )
  const asOf: BN = UnixNow()
  const platformVMUTXOResponse: any = await ctx.pchain.getUTXOs(
    [ctx.pAddressBech32!],
    ctx.cChainBlockchainID
  )
  const unsignedTx: UnsignedTx = await ctx.pchain.buildImportTx(
    platformVMUTXOResponse.utxos,
    [ctx.pAddressBech32!],
    ctx.cChainBlockchainID,
    [ctx.pAddressBech32!],
    [ctx.pAddressBech32!],
    [ctx.pAddressBech32!],
    memo,
    asOf,
    locktime,
    threshold
  )
  return <SignData>{
    requests: unsignedTx.prepareUnsignedHashes(ctx.cKeychain),
    transaction: JSON.stringify(unsignedTx.serialize("hex")),
    unsignedTransaction: unsignedTx.toBuffer().toString('hex')
  }
}

/**
 * Import funds from C-chain to P-chain by providing signed hashes
 * @param ctx - context with constants initialized from user keys
 * @param signatures - signatures of the relevant hashes
 * @param transaction - serialized import C - P transaction
 */
export async function importTxCP_rawSignatures(
  ctx: Context, signatures: string[], transaction: string
): Promise<any> {
  const ecdsaSignatures: EcdsaSignature[] = signatures.map(
    (signature: string) => expandSignature(signature))
  const unsignedTx = new UnsignedTx()
  unsignedTx.deserialize(JSON.parse(transaction), 'hex')
  const tx: Tx = unsignedTx.signWithRawSignatures(ecdsaSignatures, ctx.cKeychain)
  const txid = await ctx.pchain.issueTx(tx)
  return { txid: txid }
}