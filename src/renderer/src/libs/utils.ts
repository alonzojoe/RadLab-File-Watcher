export const extractFileName = <T extends string>(fileName: T): [string, string] => {
  const getLisTemplateCode = `LAB-FM-${fileName.split('&')[4]}`
  const getRenderNumber = fileName.split('&')[5]

  return [getLisTemplateCode, getRenderNumber]
}
