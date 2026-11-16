import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SimulatedRobot,
  type Command,
  type RefusalReason,
  type Snapshot,
} from '../domain/simulatedRobot';

export type LogEntry = { id: number; time: string; text: string };

const REFUSALS: Record<RefusalReason, string> = {
  'emergency-stop': "Commande refusée : l'arrêt d'urgence est actif",
  'speed-out-of-range': 'Commande refusée : vitesse hors de la plage 20 à 70',
  busy: 'Commande refusée : une commande est déjà en cours',
  'invalid-steps': 'Commande refusée : nombre de pas invalide',
};

export const COMMAND_LABELS: Record<string, string> = {
  sit: 'Assis',
  stand: 'Debout',
  wave: 'Saluer',
  forward: 'Avancer',
  backward: 'Reculer',
  left: 'Tourner à gauche',
  right: 'Tourner à droite',
};

export function commandKey(cmd: Command): string {
  if (cmd.type === 'walk') return cmd.direction === 'forward' ? 'forward' : 'backward';
  if (cmd.type === 'turn') return cmd.direction;
  return cmd.type;
}

function stamp(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

/** État du simulateur pour l'interface. L'horloge est celle du navigateur. */
export function useSimulation() {
  const [robot] = useState(() => new SimulatedRobot());
  const nextId = useRef(1);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => robot.snapshot(Date.now()));
  const [speed, setSpeed] = useState(40);
  const [log, setLog] = useState<LogEntry[]>(() => [
    { id: 0, time: stamp(), text: 'Simulateur prêt · modèle 3D SunFounder' },
  ]);

  const refresh = useCallback(() => setSnapshot(robot.snapshot(Date.now())), [robot]);
  const write = useCallback((text: string) => {
    setLog((l) => [{ id: nextId.current++, time: stamp(), text }, ...l].slice(0, 30));
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, 100);
    return () => clearInterval(t);
  }, [refresh]);

  const send = useCallback(
    (cmd: Command) => {
      const result = robot.command(cmd, Date.now());
      const label = COMMAND_LABELS[commandKey(cmd)];
      if (result.ok) {
        write(
          cmd.type === 'sit' || cmd.type === 'stand' ? label : `${label} · vitesse ${cmd.speed}`,
        );
      } else {
        write(REFUSALS[result.reason]);
      }
      refresh();
      return result;
    },
    [robot, refresh, write],
  );

  const engageStop = useCallback(() => {
    robot.emergencyStop(Date.now());
    write("Arrêt d'urgence : position assise");
    refresh();
  }, [robot, refresh, write]);

  const resetStop = useCallback(() => {
    robot.resetEmergencyStop();
    write('Arrêt réarmé');
    refresh();
  }, [robot, refresh, write]);

  return { snapshot, speed, setSpeed, log, send, engageStop, resetStop };
}

export type Simulation = ReturnType<typeof useSimulation>;
