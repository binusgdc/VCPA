module.exports = {
  apps : [{
    name: "VCPA",
    script: 'build/index.js',
    env: {
            //env disini
        },
  }, 
  // {
  //   script: 'src/service-worker.ts',
  //   watch: ['src/service-worker.ts']
  // }
],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
