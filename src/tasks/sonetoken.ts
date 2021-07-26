import { task } from 'hardhat/config'
import { accountToSigner } from 'src/tasks/utils'
import { SoneToken__factory } from 'src/types'
import contractAddress from 'src/deployments/sone-swap.json'

task('sonetoken:mint', 'Mint SONE token')
  .addParam('amount', 'Amount token mint')
  .addParam('to', 'Address receive token: alice, bob, address account')
  .setAction(async ({ amount, to }, hre) => {
    const [signer] = await accountToSigner(hre, 'owner')
    const [toAddress] = await accountToSigner(hre, to)
    const soneToken = SoneToken__factory.connect(contractAddress.SONE, signer)
    await soneToken.mint(toAddress.address, amount)
    console.log('amount :>> ', amount)
    console.log('to :>> ', to)
  })
