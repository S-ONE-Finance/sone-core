import { task } from 'hardhat/config'

import { accountToSigner, tokenNameToAddress, getDecimalizedBalance } from 'src/tasks/utils'
import 'src/tasks/accounts'
import 'src/tasks/erc20'

task('seed:ethers-balance', 'Transfer ETH to alice and bob', async (_taskArgs, hre) => {
  await hre.run('account:transfer', {
    from: 'owner',
    to: 'alice',
    amount: '10000000000000000000',
  })
  await hre.run('account:transfer', {
    from: 'owner',
    to: 'bob',
    amount: '10000000000000000000',
  })
})

task('seed:token-balance', 'Transfer usdt, usdc, dai to alice and bob', async (_taskArgs, hre) => {
  // Alice
  await hre.run('erc20:transfer-token', {
    from: 'owner',
    to: 'alice',
    tokenAddress: 'usdt',
    tokenDecimals: '6',
  })
  await hre.run('erc20:transfer-token', {
    from: 'owner',
    to: 'alice',
    tokenAddress: 'usdc',
    tokenDecimals: '6',
  })
  await hre.run('erc20:transfer-token', {
    from: 'owner',
    to: 'alice',
    tokenAddress: 'dai',
    tokenDecimals: '18',
  })
  // Bob
  await hre.run('erc20:transfer-token', {
    from: 'owner',
    to: 'bob',
    tokenAddress: 'usdt',
    tokenDecimals: '6',
  })
  await hre.run('erc20:transfer-token', {
    from: 'owner',
    to: 'bob',
    tokenAddress: 'usdc',
    tokenDecimals: '6',
  })
  await hre.run('erc20:transfer-token', {
    from: 'owner',
    to: 'bob',
    tokenAddress: 'dai',
    tokenDecimals: '18',
  })
  // Deposit WETH
  await hre.run('erc20:convert-eth-to-weth', {
    amount: '50000000000000000000'
  })
})
