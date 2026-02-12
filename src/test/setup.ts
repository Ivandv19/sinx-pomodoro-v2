import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extender expect con los matchers de jest-dom para pruebas de DOM
expect.extend(matchers)

// Limpiar el DOM después de cada prueba para evitar interferencias
afterEach(() => {
  cleanup()
})