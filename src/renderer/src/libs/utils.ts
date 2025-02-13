export const extractFileName = <T extends string>(fileName: T): [string, string] => {
  const getLisTemplateCode = `LAB-FM-${fileName.split('&')[4]}`
  const getRenderNumberWithExtension = fileName.split('&')[5]

  const getRenderNumber = getRenderNumberWithExtension.split('.')[0]

  return [getLisTemplateCode, getRenderNumber]
}
