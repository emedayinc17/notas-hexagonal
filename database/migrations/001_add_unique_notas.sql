-- Migration: add unique index to notas to prevent duplicate logical notes
-- Run this against your MySQL database for schema 'sga_notas'

ALTER TABLE `sga_notas`.`notas`
ADD CONSTRAINT `uk_notas_matricula_tipo_periodo_escala` UNIQUE (`matricula_clase_id`, `tipo_evaluacion_id`, `periodo_id`, `escala_id`, `is_deleted`);
