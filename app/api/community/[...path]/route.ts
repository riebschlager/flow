import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {communityRequest} from '../../../../lib/community-server.mjs';
export const dynamic='force-dynamic';
async function handle(request:Request){const user=await getChatGPTUser();return communityRequest(request,env,user?.userId??null);}
export const GET=handle,POST=handle,PUT=handle,DELETE=handle;
