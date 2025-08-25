#!/bin/bash
cd /home/kavia/workspace/code-generation/ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

