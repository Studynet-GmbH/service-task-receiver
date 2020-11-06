import sleep from "sleep-promise"

export type Dependency<D> = () => D | null | Promise<D>

export abstract class TaskReceiver<D> {
  abstract dependencyInitialization: Record<string, Dependency<D>>
  dependencies: Record<string, D>
  running: boolean

  async start() {
    this.initDependencies()
    while (this.running) {
      try {
        const task: any = await this.getTask()

        if (!task) {
          sleep(1000)
          continue
        }

        await this.handleTask(task)
      } catch (_) {
        console.log("error in task handling, trying again in 4 seconds")
        await sleep(4000)
      }
    }
  }

  stop() {
    this.running = false
  }

  abstract async getTask(): Promise<any>

  abstract async handleTask(task: any): Promise<void>

  private async initDependencies() {
    for (let key in this.dependencyInitialization) {
      let dep: any | undefined
      const f: Dependency<D> = this.dependencyInitialization[key]
      while (!dep && this.running) {
        try {
          dep = await f()
        } catch (err) {
          console.log(
            `dependency "${key}" could not be fulfilled, trying again in 3 seconds`
          )
          await sleep(3000)
        }
      }
      this.dependencies[key] = dep
    }
  }
}
