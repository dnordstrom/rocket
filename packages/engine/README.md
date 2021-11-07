# Rocket Engine



## Data cascade


docs/thisAndSubDirs.rocketData.js => docs/**/*
docs/foo/thisAndSubDirs.rocketData.js => docs/foo/**/*

docs/thisDir.rocketData.js => docs/*
docs/foo/thisDir.rocketData.js => docs/foo/*


1. file
2. thisDir & thisAndSubDirs (current dir)
3. thisAndSubDir parents
4. presets in order



TODO:
- cleanup `*.md.js` files after finish
