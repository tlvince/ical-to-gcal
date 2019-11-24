module.exports = {
  '*.ts': [
    'eslint --cache --fix',
    'git add',
    'yarn test --bail --findRelatedTests',
  ],
  '*.{js,jsx,ts,tsx,json,css,md}': ['prettier --write', 'git add'],
}
