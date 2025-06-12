/**
 * Dependency Injection utilities
 * Implements a lightweight DI container for managing service instances
 * and their dependencies across the orchestrator package.
 */

import 'reflect-metadata';

// Symbol to store metadata about dependencies
const INJECT_METADATA_KEY = Symbol('INJECT_METADATA');

/**
 * Container for storing service instances
 */
class DIContainer {
	private static instance: DIContainer;
	private services: Map<string, any> = new Map();

	private constructor() {}

	public static getInstance(): DIContainer {
		if (!DIContainer.instance) {
			DIContainer.instance = new DIContainer();
		}
		return DIContainer.instance;
	}

	public register<T>(key: string, instance: T): void {
		this.services.set(key, instance);
	}

	public resolve<T>(target: any): T {
		const serviceName = target.name;

		// Return existing instance if available
		if (this.services.has(serviceName)) {
			return this.services.get(serviceName);
		}

		// Create a new instance
		const dependencies = Reflect.getMetadata(INJECT_METADATA_KEY, target) || [];
		const injections = dependencies.map((dep: any) => this.resolve(dep));
		const instance = new target(...injections);

		// Store the instance
		this.services.set(serviceName, instance);
		return instance;
	}

	public clear(): void {
		this.services.clear();
	}
}

export const container = DIContainer.getInstance();

/**
 * Service decorator - marks a class as injectable service
 */
export const Service = (): ClassDecorator => {
	return (target: any) => {
		// Register any metadata if needed
		return target;
	};
};

/**
 * Inject decorator - marks constructor parameters for injection
 */
export const Inject = (target: any): ParameterDecorator => {
	return (targetClass, _, parameterIndex) => {
		const existingDependencies = Reflect.getMetadata(INJECT_METADATA_KEY, targetClass) || [];
		existingDependencies[parameterIndex] = target;
		Reflect.defineMetadata(INJECT_METADATA_KEY, existingDependencies, targetClass);
	};
};

/**
 * Initialize all services - useful for eager initialization
 * @param services Array of service classes to initialize
 */
export const initializeServices = (services: any[]): void => {
	services.forEach((service) => {
		container.resolve(service);
	});
};
