import { WorkspaceRequiredError } from '@yarnpkg/cli'
import { CommandContext, Configuration, Project } from '@yarnpkg/core'
import { Command, Usage, Option } from 'clipanion'
import { getDisclaimer } from '../utils'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

export class LicensesGenerateDisclaimerCommand extends Command<CommandContext> {
  static paths = [[`licenses`, `generate-disclaimer`]]

  recursive = Option.Boolean(`-R,--recursive`, false, {
    description: `Include transitive dependencies (dependencies of direct dependencies)`
  })

  production = Option.Boolean(`--production`, false, {
    description: `Exclude development dependencies`
  })

  outputStdout = Option.Boolean(`--stdout`, false, {
    description: `Output the unified licenses in stdout`
  })

  outputFile = Option.String(`--outputFile`, null, {
    description: `Output the unified licenses in a file`
  })

  outputCsv = Option.String(`--outputCsv`, null, {
    description: `Specify where to output a csv that contains all the`
  })

  outputDir = Option.String(`--outputDir`, null, {
    description: `Output split license files in the specified directory`
  })

  static usage: Usage = Command.Usage({
    description: `display the license disclaimer including all packages in the project`,
    details: `
      This command prints the license disclaimer for packages in the project. By default, only direct dependencies are listed.

      If \`-R,--recursive\` is set, the disclaimer will include transitive dependencies (dependencies of direct dependencies).

      If \`--production\` is set, the disclaimer will exclude development dependencies.
    `,
    examples: [
      [`Include licenses of direct dependencies`, `$0 licenses generate-disclaimer`],
      [`Include licenses of direct and transitive dependencies`, `$0 licenses generate-disclaimer --recursive`],
      [`Include licenses of production dependencies only`, `$0 licenses list --production`]
    ]
  })

  async execute(): Promise<void> {
    const configuration = await Configuration.find(this.context.cwd, this.context.plugins)
    const { project, workspace } = await Project.find(configuration, this.context.cwd)

    if (!workspace) {
      throw new WorkspaceRequiredError(project.cwd, this.context.cwd)
    }

    await project.restoreInstallState()

    const {disclaimers,entries} = await getDisclaimer(project, this.recursive, this.production)
    if (this.outputCsv?.length) {
      let csv = '"module name","name","version","repository","url","licenses"\n';
      for (const entry of entries) {
        csv += JSON.stringify(entry.moduleName) + ',';
        csv += JSON.stringify(entry.name) + ',';
        csv += JSON.stringify(entry.version) + ',';
        csv += JSON.stringify(entry.url) + ',';
        csv += '"",';
        csv += JSON.stringify(entry.license) + '\n';
      }
      mkdirSync(dirname(this.outputCsv), { recursive: true });
      writeFileSync(this.outputCsv, csv);
    }

    if (this.outputDir?.length) {
      for (const entry of entries) {
        let targetFile = join(this.outputDir, entry.name + "-" + entry.version, "npm-license.txt");
        mkdirSync(dirname(targetFile), { recursive: true });
        writeFileSync(targetFile, entry.disclaimer);
      }
    }

    let allDisclaimers = disclaimers.join("\n------------\n\n");
    allDisclaimers += "\n";

    if (this.outputFile) {
      mkdirSync(dirname(this.outputFile), { recursive: true });
      writeFileSync(this.outputFile, allDisclaimers);
    }

    if (this.outputStdout) {
      this.context.stdout.write(allDisclaimers);
    }
  }
}
