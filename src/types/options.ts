export type SFTrailingCommaType = 'none';
export type SFArrowParensType = 'always' | 'avoid';

export interface SFCustomOptions {
  readonly arrowParens?: SFArrowParensType;
  readonly bracketSpacing?: any;
  readonly singleQuote?: any;
  readonly trailingComma?: SFTrailingCommaType;
}

export interface SFOptionsType extends SFCustomOptions {
  readonly astFormat?: any;
  readonly filepath?: any;
  readonly inferParser?: any;
  readonly locEnd?: any;
  readonly locStart?: any;
  readonly parser?: any;
  readonly plugins?: any;
  readonly printer?: any;
  readonly proseWrap?: any;
}

export interface SFRawOptionsType {

}

