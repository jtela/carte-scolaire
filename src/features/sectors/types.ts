import type { Feature, Polygon, MultiPolygon } from 'geojson'
export type College={uai:string|null;name:string}
export type SectorProperties={id:string;datasetId:string;sourceFeatureId:string;colleges:College[];catchmentCommuneCodes:string[]|null;schoolYear:string|null}
export type SectorFeature=Feature<Polygon|MultiPolygon,SectorProperties>
export type Coverage='complete'|'partial'|'unknown'
export type Dataset={id:string;sourceId:string;title:string;publisher:string;catalogUrl:string;downloadUrl:string;licenseName:string;licenseUrl:string;sourceModifiedAt:string|null;schoolYear:string|null;retrievedAt:string;sha256:string;assetSha256:string;assetPath:string;crs:'EPSG:4326';featureCount:number;coverageNote:string}
export type CommuneEntry={datasetIds:string[];featureIds:string[];coverage:Coverage;associationMethod:'publisher-codes'|'geometry-intersection';limitation:string;bounds:[number,number,number,number]}
export type Manifest={schemaVersion:1;generatedAt:string;datasets:Dataset[];communes:Record<string,CommuneEntry>}
export type SectorResult=
 | {kind:'unavailable';reason:'not-catalogued'|'not-redistributable'}
 | {kind:'empty';datasetIds:string[];coverage:Coverage}
 | {kind:'ready';features:SectorFeature[];datasetIds:string[];coverage:Coverage}
export type SectorResponse={result:SectorResult;datasets:Dataset[];entry:CommuneEntry|null}
