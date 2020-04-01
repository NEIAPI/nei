module.exports = {
  '^/api/(?!(apimock|apimock-v2|rpcmock|rpcmock-v2)).+/.+': [
    'IdFilter'
  ],
  '^/api/(apimock|apimock-v2|rpcmock|rpcmock-v2)/|^/3api|^/openapi': [
    'CorsFilter'
  ],
  '^/openapi': [
    'OpenApiFilter'
  ],
  '^/(?!api\/projectres|api\/specificationres|api\/mockdata|api\/apimock|api\/apimock-v2|api\/rpcmock|api\/rpcmock-v2|login|$|api\/login|register|api\/register|findpwd|api\/login|r/|m/|src/|res/|dist/|tutorial|favicon.ico)': [
    'AuthFilter'
  ],
  '^/api/varmaps/': [
    'VarmapFilter'
  ],
  '^/api/specs/\\d+': [
    'SpecFilter'
  ],
  '^/api/specdocs/': [
    'SpecDocsFilter'
  ],
  '^/api/progroups/\\d+': [
    'ProGroupFilter'
  ],
  '.*\\.css$': [
    'CssFilter'
  ],
  '^/api/(projects|templates|pages|interfaces|rpcs|datatypes|groups|constraints|testcases|parameters|iheaders|cliargs)/': [
    'ResourceFilter'
  ]
};
