import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { ERC20 } from 'src/types'
import { contractData } from './data'
import { Contracts, TokenInfo, SoneContracts } from '../interface/contract-info.interface'

export const getDecimalizedBalance = async (contract: ERC20, decimal: number, address: string): Promise<string> => {
  const balance = await contract.balanceOf(address)
  return decimalize(decimal, balance)
}

export const decimalize = (decimal: number, value: BigNumber): string => {
  return value.div(BigNumber.from('10').pow(decimal)).toString()
}

export const multiplize = (decimal: number, value: BigNumber): string => {
  return value.mul(BigNumber.from('10').pow(decimal)).toString()
}

export const accountToSigner = async (
  hre: HardhatRuntimeEnvironment,
  ...names: string[]
): Promise<SignerWithAddress[]> => {
  console.log('Get address of accounts', names)
  const accounts = await hre.ethers.getSigners()

  let addresses: SignerWithAddress[] = []
  for (var name of names) {
    if (name.search('owner') != -1) {
      addresses.push(accounts[0])
    } else if (name.search('alice') != -1) {
      addresses.push(accounts[1])
    } else if (name.search('bob') != -1) {
      addresses.push(accounts[2])
    } else {
      addresses.push(await hre.ethers.getSigner(name))
    }
  }
  console.log(
    '-> account addresses :>> ',
    addresses.map((value) => value.address)
  )
  return addresses
}

export const getContracts = (network: string): Contracts => {
  return Object.getOwnPropertyDescriptor(contractData, network)?.value
}

export const tokenNameToAddress = (hre: HardhatRuntimeEnvironment, ...tokenNames: string[]): string[] => {
  let addresses: string[] = []
  console.log('Get contract address of token names', tokenNames)

  const tokens: TokenInfo[] = getCommonTokens(hre.network.name)
  for (const name of tokenNames) {
    const address = tokens.find((token) => token.symbol.toLowerCase() == name.toLowerCase())?.address
    addresses.push(address || name)
  }
  console.log('-> token addresses :>> ', addresses)
  return addresses
}

export const getCommonTokens = (network: string): TokenInfo[] => {
  const contracts: Contracts = getContracts(network)
  return contracts.tokens || []
}

export const getSoneContracts = (network: string): SoneContracts | null => {
  const contracts: Contracts = getContracts(network)
  return contracts.sone || null
}
