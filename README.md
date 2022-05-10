# env-gen 

`.env` file generator by extracting all environment variables referenced in node js project through `process.env.*`

# usage
```bash
$ cd <node app path to scan>
$ npx env-gen
```

## Optional
### Silent mode
Append `--silent` to the main command `npx env-gen` to simply scan and generate `.env` file without prompting any inputs and displaying log traces.

```bash
$ npx env-gen --silent
```

### Path exclusion
Place `env-gen-config.js` under the same path from where you are executing `npx env-gen` to exclude paths from scanning in the below format.

```javascript
module.exports = { 
    exclude: ['/node_modules', '/coverage'] //default
};
```