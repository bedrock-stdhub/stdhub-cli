export default function createBoilerplate(
  pluginName: string,
  pluginDescription: string,
  pluginVersionArray: number[],
  targetApiVersion: string,
  minEngineVersionArray: number[],
  behaviorPackUUID: string,
  scriptResourceUUID: string,
  resourcePackUUID: string,
  resourceModuleUUID: string,
) {
  return {
    bp_manifest: {
      'format_version': 2,
      'header': {
        'name': `${pluginName}-BP`,
        'description': pluginDescription,
        'uuid': behaviorPackUUID,
        'version': pluginVersionArray,
        'min_engine_version': minEngineVersionArray
      },
      'modules': [
        {
          'description': 'Script resources',
          'language': 'javascript',
          'type': 'script',
          'uuid': scriptResourceUUID,
          'version': pluginVersionArray,
          'entry': 'scripts/main.js'
        }
      ],
      'dependencies': [
        {
          'module_name': '@minecraft/server',
          'version': targetApiVersion
        },
        {
          'module_name': '@minecraft/server-net',
          'version': '1.0.0-beta'
        },
        {
          'module_name': '@minecraft/server-admin',
          'version': '1.0.0-beta'
        },
        {
          'uuid': resourcePackUUID,
          'version': pluginVersionArray
        }
      ]
    },
    rp_manifest: {
      'format_version': 2,
      'header': {
        'name': `${pluginName}-RP`,
        'description': `Resource pack for plugin ${pluginName}`,
        'uuid': resourcePackUUID,
        'version': pluginVersionArray,
        'min_engine_version': minEngineVersionArray
      },
      'modules': [
        {
          'description': 'Resource Pack',
          'type': 'resources',
          'uuid': resourceModuleUUID,
          'version': pluginVersionArray
        }
      ],
      'dependencies': [
        {
          'uuid': behaviorPackUUID,
          'version': pluginVersionArray
        }
      ]
    }
  };
}