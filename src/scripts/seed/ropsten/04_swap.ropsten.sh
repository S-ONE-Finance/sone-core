# WETH -> USDT
yarn task:ropsten router:swap \
--selected-token weth \
--the-other-token usdt \
--input-amount 12000000000000000 \
--to owner

# WETH -> USDC
yarn task:ropsten router:swap \
--selected-token weth \
--the-other-token usdc \
--input-amount 12000000000000000 \
--to owner

# WETH -> DAI
yarn task:ropsten router:swap \
--selected-token weth \
--the-other-token dai \
--input-amount 12000000000000000 \
--to owner

#  WETH -> SONE
yarn task:ropsten router:swap \
--selected-token weth \
--the-other-token sone \
--input-amount 12000000000000000 \
--to owner

# USDT -> SONE
yarn task:ropsten router:swap \
--selected-token usdt \
--the-other-token sone \
--input-amount 120000 \
--to owner