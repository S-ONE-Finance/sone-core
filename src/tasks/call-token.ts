import { BigNumber } from 'ethers'
import { task } from 'hardhat/config'

import erc20 from 'src/abi/ERC-20.json'
import tokens from 'src/deployments/erc-20-tokens.json'
import { ERC20, TetherToken } from 'src/types'

import { accountToSigner, getDecimalizedBalance, tokenNameToAddress, decimalize } from 'src/tasks/utils'

task('transfer-token', `Transfer a token from an account 'from' to another account 'to'`)
  .addParam('tokenAddress', `The contract address of a token: 'usdt', 'usdc', 'dai' or an token address`)
  .addParam('tokenDecimals', `Token decimals`)
  .addParam('from', `The account is sender: 'owner', 'alice', 'bob' or an address`)
  .addParam('to', `The account is receiver: 'owner', 'alice', 'bob' or an address`)
  .setAction(async (taskArgs, hre) => {
    console.log(taskArgs)
    const [from, to] = await accountToSigner(hre, taskArgs.from, taskArgs.to)
    const [tokenAddress] = tokenNameToAddress(taskArgs.tokenAddress)

    const contract = new hre.ethers.Contract(tokenAddress, erc20.abi, from) as TetherToken
    console.log(`Calling token '${contract.address}' to tranfer from '${from.address}' to '${to.address}'`)

    const balance = await getDecimalizedBalance(contract as unknown as ERC20, taskArgs.tokenDecimals, from.address)
    console.log('spender balance :>> ', balance, 'tokens')

    const totalSupply = await contract.functions.totalSupply()
    console.log('total supply :>> ', decimalize(Number(taskArgs.tokenDecimals), totalSupply?.[0]), 'tokens')

    await contract.functions.transfer(
      to.address,
      BigNumber.from('25000000').mul(BigNumber.from(10).pow(taskArgs.tokenDecimals)),
      { from: from.address }
    )
    const aliceBalance = await getDecimalizedBalance(contract as unknown as ERC20, taskArgs.tokenDecimals, to.address)
    console.log('receiver balance :>> ', aliceBalance, 'tokens')
  })
