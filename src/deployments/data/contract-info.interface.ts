export interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
}

export interface SoneInfo {
  soneSwap: string
  soneMasterFarmer: string
}

export interface Contracts {
  tokens?: TokenInfo[]
  sone?: SoneInfo
}

export interface ContractData {
  private?: Contracts
  ganache?: Contracts
  ropsten?: Contracts
}
