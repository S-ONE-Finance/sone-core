import { task } from 'hardhat/config'
import { ERC20 } from 'src/types'

import { accountToSigner, tokenNameToAddress, getDecimalizedBalance } from 'src/tasks/utils'
import erc20 from 'src/abi/ERC-20.json'

task('account:list', 'Prints the list of accounts', async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

task('account:balance', 'Get balance of an account')
  .addParam('account', `The account's address`)
  .setAction(async (taskArgs, hre) => {
    const signer = (await accountToSigner(hre, taskArgs.account))?.[0]
    const balance = await hre.ethers.provider.getBalance(signer.address)
    console.log(hre.ethers.utils.formatEther(balance.toString()))
  })
