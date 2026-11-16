// Conversion de dia de calendario <-> Date de Prisma (@db.Date).

export function fechaAPrisma(d: Temporal.PlainDate): Date {
  return new Date(`${d.toString()}T00:00:00.000Z`);
}

export function fechaDePrisma(d: Date): Temporal.PlainDate {
  return Temporal.PlainDate.from(d.toISOString().slice(0, 10));
}

export function fechaDePrismaOpcional(d: Date | null | undefined): Temporal.PlainDate | null {
  return d ? fechaDePrisma(d) : null;
}
