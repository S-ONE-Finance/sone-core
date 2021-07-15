import { ethers, waffle, artifacts } from 'hardhat'
import chai from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { TetherToken__factory, TetherToken } from 'src/types'
import tokens from 'src/deployments/erc-20-tokens.json'

const { deployContract } = waffle
const { expect } = chai

const IS_DEPLOYED = true

describe('Counter', () => {
  const USDT_ADDRESS: string = tokens.USDT
  const USDC_ADDRESS: string = tokens.USDC
  const DAI_ADDRESS: string = tokens.DAI

  let _usdt: TetherToken
  let _usdc: TetherToken
  let _dai: TetherToken
  let [_owner, _alice, _bob]: SignerWithAddress[] = []

  beforeEach(async () => {
    ;[_owner, _alice, _bob] = await ethers.getSigners()

    if (IS_DEPLOYED) {
      _usdt = TetherToken__factory.connect(USDT_ADDRESS, _owner)
      _usdc = TetherToken__factory.connect(USDC_ADDRESS, _owner)
      _dai = TetherToken__factory.connect(DAI_ADDRESS, _owner)
    } else {
      _usdt = (await deployContract(_owner, await artifacts.readArtifact('TetherToken'), [
        1000000000000000,
        'TetherToken',
        'USDT',
        6,
      ])) as TetherToken

      _usdc = (await deployContract(_owner, await artifacts.readArtifact('TetherToken'), [
        1000000000000000,
        'USD Coin',
        'USDC',
        6,
      ])) as TetherToken

      _dai = (await deployContract(_owner, await artifacts.readArtifact('TetherToken'), [
        1000000000000000,
        'DAI',
        'DAI',
        18,
      ])) as TetherToken
    }
  })

  describe(`check USDT contract's info`, async () => {
    it('should return total supply', async () => {
      const totalSupply = await _usdt.totalSupply()
      const expected = 1000000000000000
      expect(totalSupply.toNumber()).to.eq(expected)
    })

    it(`should return owner's balance`, async () => {
      const balance = await _usdt.balanceOf(_owner.address)
      const expected = 1000000000000000
      expect(balance.toNumber()).to.eq(expected)
    })
  })

  describe(`check USDC contract's info`, async () => {
    it('should return total supply', async () => {
      const totalSupply = await _usdc.totalSupply()
      const expected = 1000000000000000
      expect(totalSupply.toNumber()).to.eq(expected)
    })

    it(`should return owner's balance`, async () => {
      const balance = await _usdc.balanceOf(_owner.address)
      const expected = 1000000000000000
      expect(balance.toNumber()).to.eq(expected)
    })
  })

  describe(`check DAI contract's info`, async () => {
    it('should return total supply', async () => {
      const totalSupply = await _dai.totalSupply()
      const expected = BigInt('1000000000000000000000000000')
      expect(totalSupply.toString()).to.eq(expected.toString())
    })

    it(`should return owner's balance`, async () => {
      const balance = await _dai.balanceOf(_owner.address)
      const expected = BigInt('1000000000000000000000000000')
      expect(balance.toString()).to.eq(expected.toString())
    })
  })
})
