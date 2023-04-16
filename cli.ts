import cac from "cac";

const cli = cac("vperf");

cli
  .command('')
  .option("--force", "[boolean] same as vite --force")
  .option("--load [loadOn]", "['startUp'|'prebundle'] load page on server start up or prebundle")
  .action(async (options: {force?: boolean, load?: string}) => {
    const {startServer} = await import('./index')

    startServer(options)
  })

cli.help()
cli.parse()
