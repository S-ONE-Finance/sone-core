# ETH -> WETH
yarn task:ganache erc20:convert-eth-to-weth \
--amount 5000000000000000000

# Mint SONE
yarn task:ganache sonetoken:mint \
--address-token sone \
--amount 3000000000000000000000000 \
--to owner