import { BigNumber } from 'ethers'
import { task } from 'hardhat/config'

import erc20 from 'src/abi/ERC-20.json'
import tokens from 'src/deployments/erc-20-tokens.json'
import { ERC20, TetherToken } from 'src/types'

task('transfer-token', `Transfer a token from an account 'from' to another account 'to'`)
  .addParam('tokenAddress', `The contract address of a token`)
  .addParam('tokenDecimals', `Token decimals`)
  .addParam('from', `The account is sender`)
  .addParam('to', `The account is receiver`)
  .setAction(async (taskArgs, hre) => {
    console.log(taskArgs)
    const signer = await hre.ethers.getSigner(taskArgs.from)
    const contract = new hre.ethers.Contract(taskArgs.tokenAddress, erc20.abi, signer) as TetherToken

    const balance = await getDecimalizedBalance(contract as unknown as ERC20, taskArgs.tokenDecimals, taskArgs.from)
    console.log('spender balance :>> ', balance, 'tokens')

    const totalSupply = await contract.functions.totalSupply()
    console.log('total supply :>> ', decimalize(6, totalSupply?.[0]), 'tokens')

    await contract.functions.transfer(
      taskArgs.to,
      BigNumber.from('25000000').mul(BigNumber.from(10).pow(taskArgs.tokenDecimals)),
      { from: taskArgs.from }
    )
    const aliceBalance = await getDecimalizedBalance(contract as unknown as ERC20, taskArgs.tokenDecimals, taskArgs.to)
    console.log('receiver balance :>> ', aliceBalance, 'tokens')
  })

const getDecimalizedBalance = async (contract: ERC20, decimal: number, address: string): Promise<string> => {
  const balances = await contract.functions.balanceOf(address)
  const balance = decimalize(decimal, balances?.[0])
  return balance
}

const decimalize = (decimal: number, value: BigNumber): string => {
  return value.div(BigNumber.from('10').pow(decimal)).toString()
}
