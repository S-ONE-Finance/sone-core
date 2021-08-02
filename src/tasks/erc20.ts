import { BigNumber } from 'ethers'
import { task, types } from 'hardhat/config'

import erc20 from 'src/abi/ERC-20.json'
import { ERC20, TetherToken, UniswapV2ERC20__factory } from 'src/types'

import {
  accountToSigner,
  getDecimalizedBalance,
  tokenNameToAddress,
  decimalize,
  getCommonTokens,
  getSoneContracts,
} from 'src/tasks/utils'

task('erc20:token-balance', 'Get token balance of an account')
  .addParam('tokenAddress', `The token address`)
  .addParam('tokenDecimals', `The token decimals`)
  .addParam('account', `The account's address`)
  .setAction(async (taskArgs, hre) => {
    const [signer] = await accountToSigner(hre, taskArgs.account)
    const [tokenAddress] = tokenNameToAddress(hre, taskArgs.tokenAddress)

    const contract = new hre.ethers.Contract(tokenAddress, erc20.abi, signer) as ERC20

    const balance = await getDecimalizedBalance(contract, taskArgs.tokenDecimals, signer.address)
    console.log('balance :>> ', balance.toString())
  })

task('erc20:approve', 'ERC20 approve')
  .addParam('from', 'From address')
  .addParam('token', 'Token')
  .addParam('spender', 'Spender')
  .addOptionalParam('amount', 'Approval amount', Number.MAX_SAFE_INTEGER.toString(), types.string)
  .setAction(async ({ from, token, spender, amount }, hre) => {
    const [fromSigner, spenderSigner] = await accountToSigner(hre, from, spender)
    const [tokenAddress] = tokenNameToAddress(hre, token)
    const tokenContract = UniswapV2ERC20__factory.connect(tokenAddress, fromSigner)
    await (
      await tokenContract.approve(spenderSigner.address, BigNumber.from(amount), {
        from: fromSigner.address,
      })
    ).wait()
  })

task('erc20:transfer-token', `Transfer a token from an account 'from' to another account 'to'`)
  .addParam('tokenAddress', `The contract address of a token: 'usdt', 'usdc', 'dai' or an token address`)
  .addParam('tokenDecimals', `Token decimals`)
  .addParam('from', `The account is sender: 'owner', 'alice', 'bob' or an address`)
  .addParam('to', `The account is receiver: 'owner', 'alice', 'bob' or an address`)
  .setAction(async (taskArgs, hre) => {
    console.log(taskArgs)
    const [from, to] = await accountToSigner(hre, taskArgs.from, taskArgs.to)
    const [tokenAddress] = tokenNameToAddress(hre, taskArgs.tokenAddress)

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

task('erc20:get-common-tokens', 'Get common tokens such as: usdt, usdc, dai, sone, ect.').setAction(async ({}, hre) => {
  console.log('tokens :>> ', getCommonTokens(hre.network.name))
})

task('erc20:get-sone-contracts', 'Get sone contracts: factory, router, masterFarmer').setAction(async ({}, hre) => {
  console.log('sone contracts :>> ', getSoneContracts(hre.network.name))
})
