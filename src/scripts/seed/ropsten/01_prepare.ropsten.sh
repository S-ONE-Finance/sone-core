# ETH -> WETH
yarn task:ropsten erc20:convert-eth-to-weth --amount 1500000000000000000

# Mint SONE
yarn task:ropsten sonetoken:mint --address-token sone --amount 3000000000000000000000000 --to owner

### OTHER ACCOUNTS
#  Mint SONE
yarn task:ropsten sonetoken:mint --address-token sone --amount 200000000000000000000000 --to alice
yarn task:ropsten sonetoken:mint --address-token sone --amount 200000000000000000000000 --to bob
yarn task:ropsten sonetoken:mint --address-token sone --amount 200000000000000000000000 --to alice2
yarn task:ropsten sonetoken:mint --address-token sone --amount 200000000000000000000000 --to bob2

# Transfer tokens
# USDT
yarn task:ropsten erc20:transfer-token --from owner --to alice --token-address usdt --token-decimals 6
yarn task:ropsten erc20:transfer-token --from owner --to bob --token-address usdt --token-decimals 6
yarn task:ropsten erc20:transfer-token --from owner --to alice2 --token-address usdt --token-decimals 6
yarn task:ropsten erc20:transfer-token --from owner --to bob2 --token-address usdt --token-decimals 6
# USDC
yarn task:ropsten erc20:transfer-token --from owner --to alice --token-address usdc --token-decimals 6
yarn task:ropsten erc20:transfer-token --from owner --to bob --token-address usdc --token-decimals 6
yarn task:ropsten erc20:transfer-token --from owner --to alice2 --token-address usdc --token-decimals 6
yarn task:ropsten erc20:transfer-token --from owner --to bob2 --token-address usdc --token-decimals 6
# DAI
yarn task:ropsten erc20:transfer-token --from owner --to alice --token-address dai --token-decimals 18
yarn task:ropsten erc20:transfer-token --from owner --to bob --token-address dai --token-decimals 18
yarn task:ropsten erc20:transfer-token --from owner --to alice2 --token-address dai --token-decimals 18
yarn task:ropsten erc20:transfer-token --from owner --to bob2 --token-address dai --token-decimals 18
# ETH -> WETH
yarn task:ropsten erc20:convert-eth-to-weth --account alice --amount 50000000000000000
yarn task:ropsten erc20:convert-eth-to-weth --account bob --amount 50000000000000000
yarn task:ropsten erc20:convert-eth-to-weth --account alice2 --amount 50000000000000000
yarn task:ropsten erc20:convert-eth-to-weth --account bob2 --amount 50000000000000000