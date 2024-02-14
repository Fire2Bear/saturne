import {Controls} from '@/components/hooks/useControl';
import {Road} from '@/domain/model/Road';
import {Traffic} from '@/domain/model/Traffic';
import {Point, point, polysIntersect} from '@/domain/utils';

type Car = {
  size: {
    width: number;
    height: number;
  };
  polygon: Point[];

  damaged: boolean;

  speed: number;
  maxSpeed: number;
  x: number;
  y: number;
  angle: number;
};

const MAX_SPEED = 1.5;
const FRICTION = 0.5;

const CAR_WIDTH = 30;
const CAR_HEIGHT = 50;

const createCar = ({speed, x, y, angle, maxSpeed}: Partial<Car>): Car => {
  return {
    size: {
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
    },
    polygon: [],
    damaged: false,
    speed: speed ?? 0,
    maxSpeed: maxSpeed ?? MAX_SPEED,
    x: x ?? 100,
    y: y ?? 100,
    angle: angle ?? 0,
  };
};

const convertOutputsToControls = (outputs: number[]): Controls => {
  return {
    left: !!outputs[0],
    right: !!outputs[1],
    forward: !!outputs[2],
    reverse: !!outputs[3],
  };
};

const updateCarFromControls = (
  car: Car,
  controls: Controls,
  roadBorders: Road['borders'],
  traffic: Traffic,
  delta: number
): Car => {
  let {x, y, angle, speed, damaged} = car;
  if (!damaged) {
    const movedCar = move(car, controls, delta);
    const polygon = createPolygon(car);
    const damaged = assessDamaged(car, roadBorders, traffic);
    return {...movedCar, polygon, damaged};
  }
  return car;
};

const move = (car: Car, {forward, left, right, reverse}: Controls, delta: number) => {
  let {x, y, angle, speed} = car;

  const deltaPercentage = delta / 100;
  const currentFriction = FRICTION * deltaPercentage;

  const acceleration = (forward ? 1 : reverse ? -1 : 0) * deltaPercentage;

  speed = car.speed + acceleration;
  if (speed > car.maxSpeed) speed = car.maxSpeed;
  if (speed < -car.maxSpeed / 2) speed = -car.maxSpeed / 2;

  if (speed > 0) speed -= currentFriction;
  if (speed < 0) speed += currentFriction;

  if (speed !== 0) {
    const flip = speed > 0 ? 1 : -1;
    const angleModif = right ? -0.03 : left ? 0.03 : 0;
    angle += angleModif * flip;
  }

  if (Math.abs(speed) < currentFriction) speed = 0;

  const newCar: Car = createCar({
    ...car,
    speed,
    angle,
    x: x - Math.sin(angle) * speed,
    y: y - Math.cos(angle) * speed,
  });

  return newCar;
};

const createPolygon = (car: Car) => {
  const points: Point[] = [];

  const rad = Math.hypot(car.size.width, car.size.height) / 2;

  const alpha = Math.atan2(car.size.width, car.size.height);

  points.push(point(car.x - Math.sin(car.angle - alpha) * rad, car.y - Math.cos(car.angle - alpha) * rad));
  points.push(point(car.x - Math.sin(car.angle + alpha) * rad, car.y - Math.cos(car.angle + alpha) * rad));
  points.push(
    point(car.x - Math.sin(Math.PI + car.angle - alpha) * rad, car.y - Math.cos(Math.PI + car.angle - alpha) * rad)
  );
  points.push(
    point(car.x - Math.sin(Math.PI + car.angle + alpha) * rad, car.y - Math.cos(Math.PI + car.angle + alpha) * rad)
  );

  return points;
};

const assessDamaged = (car: Car, roadBorders: Road['borders'], traffic: Traffic) => {
  for (const border of roadBorders) {
    if (polysIntersect(car.polygon, [border.a, border.b])) return true;
  }

  for (const trafficCar of traffic) {
    if (polysIntersect(car.polygon, trafficCar.polygon)) return true;
  }
  return false;
};

const drawCar = (car: Car, ctx: CanvasRenderingContext2D, color: string) => {
  if (car.damaged) {
    ctx.fillStyle = 'gray';
  } else {
    ctx.fillStyle = color;
  }

  ctx.beginPath();
  ctx.moveTo(car.polygon[0].x, car.polygon[0].y);

  for (let i = 1; i < car.polygon.length; i++) {
    ctx.lineTo(car.polygon[i].x, car.polygon[i].y);
  }

  ctx.fill();
};

export {createCar, drawCar, updateCarFromControls, createPolygon, convertOutputsToControls};
export type {Car};
