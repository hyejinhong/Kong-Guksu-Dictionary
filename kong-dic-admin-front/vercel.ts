import { routes, deploymentEnv, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  rewrites: [
    routes.rewrite('/api/admin/:path*', `${deploymentEnv('GCP_ADMIN_URL')}/:path*`),
    routes.rewrite('/api/main/:path*', `${deploymentEnv('GCP_MAIN_URL')}/:path*`),
    routes.rewrite('/(.*)', '/index.html'),
  ],
};