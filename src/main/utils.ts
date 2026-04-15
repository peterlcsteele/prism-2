import { app } from 'electron'
import { XMLParser, X2jOptions, XMLBuilder, XmlBuilderOptions } from 'fast-xml-parser'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertXMLToJS = (xml: string): any => {
  const options: X2jOptions = {
    ignoreAttributes: false,
    allowBooleanAttributes: true, // Whether to allow attibutes without value (treated as true)
    parseAttributeValue: true, // Parse the value of an attribute to float, integer, or boolean
    attributeNamePrefix: ''
  }
  const parser = new XMLParser(options)
  return parser.parse(xml, true)
}

export const convertJSToXML = (obj): string => {
  const options: XmlBuilderOptions = {
    ignoreAttributes: false,
    suppressBooleanAttributes: false
  }
  const builder = new XMLBuilder(options)
  return builder.build(obj)
}

export const getAppSlug = (): string => {
  // Get safe app name
  return app
    .getName()
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
}
