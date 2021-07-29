import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { format } from 'util'

import { ContractData, TokenInfo, SoneInfo } from './contract-info.interface'

const DEPLOYMENT_PATH = resolve('src/deployments')
const TOKEN_PATH = resolve(DEPLOYMENT_PATH, 'data', `tokens.%s.json`)
const SONE_PATH = resolve(DEPLOYMENT_PATH, 'data', `sone.%s.json`)

function getTokens(path: string): TokenInfo[] {
  return existsSync(path) ? JSON.parse(readFileSync(path).toString()) : []
}
function getSoneContracts(path: string): SoneInfo {
  return existsSync(path) ? JSON.parse(readFileSync(path).toString()) : {}
}

var privateTokens: TokenInfo[] = getTokens(format(TOKEN_PATH, 'private'))
var ganacheTokens: TokenInfo[] = getTokens(format(TOKEN_PATH, 'ganache'))
var ropstenTokens: TokenInfo[] = getTokens(format(TOKEN_PATH, 'ropsten'))

var ganacheSone: SoneInfo = getSoneContracts(format(SONE_PATH, 'ganache'))
var privateSone: SoneInfo = getSoneContracts(format(SONE_PATH, 'private'))
var ropstenSone: SoneInfo = getSoneContracts(format(SONE_PATH, 'ropsten'))

export const contractData: ContractData = {
  private: {
    tokens: privateTokens,
    sone: privateSone,
  },
  ganache: {
    tokens: ganacheTokens,
    sone: ganacheSone,
  },
  ropsten: {
    tokens: ropstenTokens,
    sone: ropstenSone,
  },
}
