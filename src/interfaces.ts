import { SignatureRequest } from "@flarenetwork/flarejs/dist/common"
import { Avalanche } from '@flarenetwork/flarejs'
import { EVMAPI, KeyChain as EVMKeyChain } from '@flarenetwork/flarejs/dist/apis/evm'
import { PlatformVMAPI as PVMAPI, KeyChain as PVMKeyChain } from '@flarenetwork/flarejs/dist/apis/platformvm'
import { NetworkConfig } from './config'

export interface Context {
  privkHex?: string
  privkCB58?: string
  publicKey?: [Buffer, Buffer]
  rpcurl: string
  web3: any
  avalanche: Avalanche
  cchain: EVMAPI
  pchain: PVMAPI
  cKeychain: EVMKeyChain
  pKeychain: PVMKeyChain
  pAddressBech32?: string
  cAddressBech32?: string
  cAddressHex?: string
  cChainBlockchainID: string
  pChainBlockchainID: string
  avaxAssetID: string
  config: NetworkConfig
}

export interface ContextFile {
  publicKey: string
  network: string,
  flareAddress?: string
  ethAddress?: string
  vaultId?: string
}

export interface UnsignedTxJson {
  transactionType: string
  serialization: string
  signatureRequests: SignatureRequest[]
  unsignedTransactionBuffer: string // hex
  usedFee?: string // c-chain fee (don't know why is not logged inside buffer)
  txDetails?: string // JSON of the unsigned transaction
  forDefiTxId?: string
  forDefiHash?: string
}

export interface SignedTxJson extends UnsignedTxJson {
  signature: string
}

export interface UnsignedWithdrawalTxJson {
  rawTx: WithdrawalTxData
  message: string
  forDefiTxId?: string
  forDefiHash?: string
}

export interface SignedWithdrawalTxJson extends UnsignedWithdrawalTxJson {
  signature: string
}

export interface FlareTxParams {
  amount?: string
  fee?: string
  nodeId?: string
  startTime?: string
  endTime?: string
  nonce?: string
  delegationFee?: string,
  threshold?: string
}

interface WithdrawalTxData {
  nonce: number
  gasPrice: number
  gasLimit: number
  to: string
  value: string | bigint
  chainId: number
}
