export class DeploymentDependencyError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DeploymentDependencyError";
    this.code = code;
  }
}

export class DataSourceUnavailableError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DataSourceUnavailableError";
    this.code = code;
  }
}
