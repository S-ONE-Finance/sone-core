import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import erc20 from 'src/abi/ERC-20.json'
import tokens from 'src/deployments/erc-20-tokens.json'
import { ERC20, TetherToken } from 'src/types'

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
  console.log('Get address of accounts :>> ', names)
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
    'addresses :>> ',
    addresses.map((value) => value.address)
  )
  return addresses
}

export const tokenNameToAddress = (...names: string[]): string[] => {
  let addresses: string[] = []
  console.log('Get contract address of token names :>> ', names)
  for (const name of names) {
    if (name.search('usdt') != -1) {
      addresses.push(tokens.USDT)
    } else if (name.search('usdc') != -1) {
      addresses.push(tokens.USDC)
    } else if (name.search('dai') != -1) {
      addresses.push(tokens.DAI)
    } else {
      addresses.push(name)
    }
  }
  console.log('addresses :>> ', addresses)
  return addresses
}
