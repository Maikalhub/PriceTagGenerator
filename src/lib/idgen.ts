let counter = 0;
export function v4ID(): string {
  counter++;
  return `el-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}
