# WETH -> USDT
yarn task:rinkeby router:swap \
--selected-token weth \
--the-other-token usdt \
--input-amount 0.012 \
--to owner

# WETH -> USDC
yarn task:rinkeby router:swap \
--selected-token weth \
--the-other-token usdc \
--input-amount 0.012 \
--to owner

# WETH -> DAI
yarn task:rinkeby router:swap \
--selected-token weth \
--the-other-token dai \
--input-amount 0.012 \
--to owner

#  WETH -> SONE
yarn task:rinkeby router:swap \
--selected-token weth \
--the-other-token sone \
--input-amount 0.012 \
--to owner

# USDT -> SONE
yarn task:rinkeby router:swap \
--selected-token usdt \
--the-other-token sone \
--input-amount 0.12 \
--to owner