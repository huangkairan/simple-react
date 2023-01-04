import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import {
	Type,
	Key,
	Ref,
	Props,
	ReactElement,
	ElementType
} from 'shared/ReactTypes';
// ReactElement

const ReactElement = (type: Type, key: Key, ref: Ref, props: Props) => {
	const element: ReactElement = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__innerMark: 'kaba'
	};
	return element;
};

export const jsx = (type: ElementType, config: any, ...children: any) => {
	let key: Key = null;
	let ref: Ref = null;
	const props: Props = {};
	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (val !== undefined) {
				key = val;
			}
			continue;
		}
		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val;
			}
			continue;
		}
		if (Object.prototype.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}

		if (children.length) {
			props.children = children.length === 1 ? children[0] : children;
		}
		return ReactElement(type, key, ref, props);
	}
};

export const jsxDev = jsx;
