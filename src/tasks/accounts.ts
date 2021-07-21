import { task } from 'hardhat/config'
import { ERC20 } from 'src/types'

import { accountToSigner, tokenNameToAddress, getDecimalizedBalance } from 'src/tasks/utils'
import erc20 from 'src/abi/ERC-20.json'

task('accounts', 'Prints the list of accounts', async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

task('balance', 'Get balance of an account')
  .addParam('account', `The account's address`)
  .setAction(async (taskArgs, hre) => {
    const signer = (await accountToSigner(hre, taskArgs.account))?.[0]
    const balance = await hre.ethers.provider.getBalance(signer.address)
    console.log(hre.ethers.utils.formatEther(balance.toString()))
  })

task('token-balance', 'Get token balance of an account')
  .addParam('tokenAddress', `The token address`)
  .addParam('tokenDecimals', `The token decimals`)
  .addParam('account', `The account's address`)
  .setAction(async (taskArgs, hre) => {
    const signer = (await accountToSigner(hre, taskArgs.account))?.[0]
    const tokenAddress = tokenNameToAddress(taskArgs.tokenAddress)?.[0]

    const contract = new hre.ethers.Contract(tokenAddress, erc20.abi, signer) as ERC20

    const balance = await getDecimalizedBalance(contract, taskArgs.tokenDecimals, signer.address)
    console.log('balance :>> ', balance.toString())
  })
