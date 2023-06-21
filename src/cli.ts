import { Command, OptionValues } from 'commander'
import { BN } from '@flarenetwork/flarejs/dist'
import createLogger from 'logging'
import {
  privateKeyToPublicKey, compressPublicKey, publicKeyToBech32AddressString,
  integerToDecimal, decimalToInteger, parseRelativeTime, decodePublicKey
} from './utils'
import { contextEnv, Context } from './constants'
import { exportTxCP, importTxPC, exportTxCP_rawSignatures, exportTxCP_unsignedHashes } from './evmAtomicTx'
import { exportTxPC, importTxCP, importTxCP_rawSignatures, importTxCP_unsignedHashes } from './pvmAtomicTx'
import { addValidator, addValidator_rawSignatures, addValidator_unsignedHashes } from './addValidator'
import { addDelegator, addDelegator_rawSignatures, addDelegator_unsignedHashes } from './addDelegator'

const logger = createLogger('info')

export async function cli(program: Command) {
  // global configurations
  program
    .option("--network <network>", "Network name (flare or costwo)", 'flare')
    .option("--env-path <path>", "Path to the .env file", 'env')
    .option("--get-hashes", "Get hashes of transaction to sign")
    .option("--use-signatures", "Use hash signatures to finalize the transaction")
  // information about the network
  program
    .command("info").description("Relevant information")
    .argument("<type>", "Type of information")
    .action(async (type: string) => {
      const options = program.opts()
      const ctx = contextEnv(options.envPath, options.network)
      if (type == 'addresses') {
        getAddressInfo(ctx)
      } else if (type == 'balance') {
        await getBalanceInfo(ctx)
      } else if (type == 'network') {
        getNetworkInfo(ctx)
      } else if (type == 'livenetwork') {
        // implement this nicely
      } else if (type == 'validators') {
        await getValidatorInfo(ctx)
      }
    })
  // moving funds from one chain to another
  program
    .command("crosschain").description("Move funds from one chain to another")
    .argument("<type>", "Type of a crosschain transaction")
    .option("-a, --amount <amount>", "Amount to transfer")
    .option("-f, --fee <fee>", "Fee of a transaction")
    .option("-id, --transaction-id <transaction-id>", "Id of the transaction to finalize")
    .option("-sg, --signatures <signatures>", "Signatures of the obtained hashes")
    .action(async (type: string, options: OptionValues) => {
      options = {...options, ...program.opts()}
      const ctx = contextEnv(options.envPath, options.network)
      if (type == 'exportCP') {
        if (options.getHashes) {
          await exportCP_getHashes(ctx, options.amount, options.fee)
        } else if (options.useSignatures) {
          await exportCP_useSignatures(ctx, options.signatures.split(" "), options.transactionId)
        } else {
          await exportCP(ctx, options.amount, options.fee)
        }
      } else if (type == 'importCP') {
        if (options.getHashes) {
          await importCP_getHashes(ctx)
        } else if (options.useSignatures) {
          await importCP_useSignatures(ctx, options.signatures.split(" "), options.transactionId)
        } else {
          await importCP(ctx)
        }
      } else if (type == 'exportPC') {
        // two-part p-c export not yet implemented
        await exportPC(ctx, options.amount)
      } else if (type == 'importPC') {
        // two-part p-c import not yet implemented
        await importPC(ctx, options.fee)
      }
    })
  // staking
  program
    .command("stake").description("Stake funds on the P-chain")
    .option("-n, --node-id <nodeID>", "The staking node's id")
    .option("-a, --amount <amount>", "Amount to stake")
    .option("-s, --start-time <start-time>", "Start time of the staking process")
    .option("-e, --end-time <end-time>", "End time of the staking process")
    .option("-tx, --transaction <transaction>", "Serialized transaction obtained along the hashes")
    .option("-sg, --signatures <signatures>", "Signatures of the obtained hashes")
    .action(async (options: OptionValues) => {
      options = {...options, ...program.opts()}
      const ctx = contextEnv(options.envPath, options.network)
      let startTime
      let endTime
      if (options.startTime && options.endTime) {
        startTime = options.startTime.startsWith("now+") ? parseRelativeTime(options.startTime) : options.startTime
        endTime = options.endTime.startsWith("now+") ? parseRelativeTime(options.endTime) : options.endTime
      }
      if (options.getHashes) {
        await stake_getHashes(ctx, options.nodeId, options.amount, startTime, endTime)
      } else if (options.useSignatures) {
        await stake_useSignatures(ctx, options.signatures.split(" "), options.transaction)
      } else {
        await stake(ctx, options.nodeId, options.amount, startTime, endTime)
      }
    })
  // delegating
  program
    .command("delegate").description("Delegate funds on the P-chain")
    .option("-n, --node-id <nodeID>", "The staking node's id")
    .option("-a, --amount <amount>", "Amount to delegate")
    .option("-s, --start-time <start-time>", "Start time of the delegation process")
    .option("-e, --end-time <end-time>", "End time of the delegation process")
    .option("-tx, --transaction <transaction>", "Serialized transaction obtained along the hashes")
    .option("-sg, --signatures <signatures>", "Signatures of the obtained hashes")
    .action(async (options: OptionValues) => {
      options = {...options, ...program.opts()}
      const ctx = contextEnv(options.envPath, options.network)
      let startTime
      let endTime
      if (options.startTime && options.endTime) {
        startTime = options.startTime.startsWith("now+") ? parseRelativeTime(options.startTime) : options.startTime
        endTime = options.endTime.startsWith("now+") ? parseRelativeTime(options.endTime) : options.endTime
      }
      if (options.getHashes) {
        await delegate_getHashes(ctx, options.nodeId, options.amount, startTime, endTime)
      } else if (options.useSignatures) {
        await delegate_useSignatures(ctx, options.signatures.split(" "), options.transaction)
      } else {
        await delegate(ctx, options.nodeId, options.amount, startTime, endTime)
      }
    })
  }

function getAddressInfo(ctx: Context) {
  const [pubX, pubY] = ctx.publicKey!
  const compressedPubKey = compressPublicKey(pubX, pubY).toString('hex')
  logger.info(`P-chain address: ${ctx.pAddressBech32}`)
  logger.info(`C-chain address hex: ${ctx.cAddressHex}`)
  logger.info(`secp256k1 public key: 0x${compressedPubKey}`)
}

async function getBalanceInfo(ctx: Context) {
  let cbalance = (new BN(await ctx.web3.eth.getBalance(ctx.cAddressHex!))).toString()
  let pbalance = (new BN((await ctx.pchain.getBalance(ctx.pAddressBech32!)).balance)).toString()
  cbalance = integerToDecimal(cbalance, 18)
  pbalance = integerToDecimal(pbalance, 9)
  logger.info(`C-chain ${ctx.cAddressHex}: ${cbalance}`)
  logger.info(`P-chain ${ctx.pAddressBech32}: ${pbalance}`)
}

function getNetworkInfo(ctx: Context) {
  const pchainId = ctx.pchain.getBlockchainID()
  const cchainId = ctx.cchain.getBlockchainID()
  logger.info(`blockchainId for P-chain: ${pchainId}`)
  logger.info(`blockchainId for C-chain: ${cchainId}`)
  logger.info(`assetId: ${ctx.avaxAssetID}`)
}

async function getValidatorInfo(ctx: Context) {
  const pending = await ctx.pchain.getPendingValidators()
  const current = await ctx.pchain.getCurrentValidators()
  const fpending = JSON.stringify(pending, null, 2)
  const fcurrent = JSON.stringify(current, null, 2)
  logger.info(`pending: ${fpending}`)
  logger.info(`current: ${fcurrent}`)
}

async function exportCP(ctx: Context, amount: string, fee?: string) {
  const famount: BN = new BN(decimalToInteger(amount, 9))
  const ffee = (fee === undefined) ? fee : new BN(decimalToInteger(fee, 9))
  const { txid, usedFee } = await exportTxCP(ctx, famount, ffee)
  if (fee !== usedFee) logger.info(`Used fee of ${usedFee}`)
  logger.info(`Success! TXID: ${txid}`)
}

async function exportCP_getHashes(ctx: Context, amount: string, fee?: string) {
  const famount: BN = new BN(decimalToInteger(amount, 9))
  const ffee = (fee === undefined) ? fee : new BN(decimalToInteger(fee, 9))
  const { txid, usedFee, signatureRequests } = await exportTxCP_unsignedHashes(ctx, famount, ffee)
  if (fee !== usedFee) logger.info(`Used fee of ${usedFee}`)
  logger.info(`
  txid: ${txid},
  Hashes with signers: ${signatureRequests.map(x => `(${x.message}, ${x.signer})`)}
  `)
}

async function exportCP_useSignatures(ctx: Context, signatures: string[], txid: string) {
  const { chainTxId } = await exportTxCP_rawSignatures(ctx, signatures, txid)
  logger.info(`Success! TXID: ${chainTxId}`)
}

async function importCP(ctx: Context) {
  const { txid } = await importTxCP(ctx)
  logger.info(`Success! TXID: ${txid}`)
}

async function importCP_getHashes(ctx: Context) {
  const { txid, signatureRequests } = await importTxCP_unsignedHashes(ctx)
  logger.info(`
  txid: ${txid},
  Hashes with signers: ${signatureRequests.map(x => `(${x.message}, ${x.signer})`)}
  `)
}

async function importCP_useSignatures(ctx: Context, signatures: string[], txid: string) {
  const { chainTxId } = await importTxCP_rawSignatures(ctx, signatures, txid)
  logger.info(`Success! TXID: ${chainTxId}`)
}

async function exportPC(ctx: Context, amount?: string) {
  const famount = (amount === undefined) ?
    amount : new BN(decimalToInteger(amount, 9))
  const { txid } = await exportTxPC(ctx, famount)
  logger.info(`Success! TXID: ${txid}`)
}

async function importPC(ctx: Context, fee?: string) {
  const ffee = (fee === undefined) ?
    fee : new BN(decimalToInteger(fee, 9))
  const { txid, usedFee } = await importTxPC(ctx, ffee)
  if (fee !== usedFee) logger.info(`Used fee of ${usedFee}`)
  logger.info(`Success! TXID: ${txid}`)
}

async function stake(
  ctx: Context, nodeID: string, amount: string,
  start: string, end: string
) {
  const famount = new BN(decimalToInteger(amount, 9))
  const { txid } = await addValidator(ctx, nodeID, famount, new BN(start), new BN(end))
  logger.info(`Success! TXID: ${txid}`)
}

async function stake_getHashes(
  ctx: Context, nodeID: string, amount: string,
  start: string, end: string
) {
  const famount = new BN(decimalToInteger(amount, 9))
  const signData = await addValidator_unsignedHashes(ctx, nodeID, famount, new BN(start), new BN(end))
  logger.info(`
  Hashes with signers: ${signData.requests.map(x => `(${x.message}, ${x.signer})`)}
  Serialized transaction: ${signData.transaction}
  Unsigned transaction: ${signData.unsignedTransaction}`)
}

async function stake_useSignatures(ctx: Context, signatures: string[], transaction: string) {
  const { txid } = await addValidator_rawSignatures(ctx, signatures, transaction)
  logger.info(`Success! TXID: ${txid}`)
}

async function delegate(
  ctx: Context, nodeID: string, amount: string,
  start: string, end: string
) {
  const famount = new BN(decimalToInteger(amount, 9))
  const { txid } = await addDelegator(ctx, nodeID, famount, new BN(start), new BN(end))
  logger.info(`Success! TXID: ${txid}`)
}

async function delegate_getHashes(
  ctx: Context, nodeID: string, amount: string,
  start: string, end: string
) {
  const famount = new BN(decimalToInteger(amount, 9))
  const signData = await addDelegator_unsignedHashes(ctx, nodeID, famount, new BN(start), new BN(end))
  logger.info(`
  Hashes with signers: ${signData.requests.map(x => `(${x.message}, ${x.signer})`)}
  Serialized transaction: ${signData.transaction}
  Unsigned transaction: ${signData.unsignedTransaction}`)
}

async function delegate_useSignatures(ctx: Context, signatures: string[], transaction: string) {
  const { txid } = await addDelegator_rawSignatures(ctx, signatures, transaction)
  logger.info(`Success! TXID: ${txid}`)
}