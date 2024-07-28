export default (path: string) =>
  path.replace(/\\/g, "/").split("/").pop()!.split(".").reverse()[0];
