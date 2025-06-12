/**
 * Dependency Injection module for the orchestrator package
 *
 * This file provides the DI container implementation, Service and Inject decorators
 * for managing dependencies in the orchestrator.
 */

import 'reflect-metadata';
import { Container as BaseContainer, Service as BaseService } from '@n8n/di';

const container = BaseContainer;

/**
 * Service decorator for registering classes with the DI container
 */
export function Service() {
	return BaseService();
}

/**
 * Inject decorator for parameters
 */
export function Inject(type: any): ParameterDecorator {
	return function (
		target: Object,
		propertyKey: string | symbol | undefined,
		parameterIndex: number,
	) {
		const existingParams = Reflect.getMetadata('design:paramtypes', target) || [];
		existingParams[parameterIndex] = type;

		if (propertyKey === undefined) {
			// For constructor parameters
			Reflect.defineMetadata('design:paramtypes', existingParams, target);
		} else {
			// For method parameters
			Reflect.defineMetadata('design:paramtypes', existingParams, target, propertyKey);
		}
	};
}

/**
 * Container for managing services and dependencies
 */

/**
 * Get a service instance from the container
 * @param type The constructor of the service to retrieve
 * @returns The service instance
 */
export function getService<T>(type: new (...args: any[]) => T): T {
	return container.get(type);
}
