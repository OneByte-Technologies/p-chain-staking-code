import { decimalToInteger } from '../src/utils'
import { exportTxCP } from '../src/evmExchange'
import { BN } from '@flarenetwork/flarejs/dist'
const yargs = require('yargs')

const args = yargs
  .option('amount', {
    alias: 'a',
    description: 'amount of funds to export from C-chain to P-chain',
    demand: true,
    type: 'string',
  })
  .option('fee', {
    alias: 'f',
    description: 'fee to use when exporting (subtracted from amount)',
    demand: false,
    default: undefined,
    type: 'string',
  }).argv

const amount = new BN(decimalToInteger(args.amount, 9))
const fee = (args.fee === undefined) ? undefined : new BN(decimalToInteger(args.fee, 9))
exportTxCP(amount, fee)