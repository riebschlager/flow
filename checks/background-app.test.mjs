import {execFileSync} from 'node:child_process';
for(const FLOW_BACKGROUND_QUANTIZED of ['0','1'])console.log(execFileSync(process.execPath,['checks/app-smoke.test.mjs'],{env:{...process.env,FLOW_BACKGROUND_CHECK:'1',FLOW_BACKGROUND_QUANTIZED},encoding:'utf8'}));
