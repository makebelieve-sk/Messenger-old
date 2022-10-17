import Enzyme, { render, shallow, mount } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import useTest from "./hooks/useTest";

export const setUp = (testMethod, component) => Enzyme[testMethod](useTest(component));

// Адаптер для React v17
Enzyme.configure({ adapter: new Adapter() });

// Мокаем next/router
jest.mock('next/router', () => require('next-router-mock'));

// Сохраняем глобальные переменные
global.render = render;
global.shallow = shallow;
global.mount = mount;

// Обработка ошибок
console.error = message => {
    throw new Error(`При прогоне тестов возникла ошибка: ${message}`);
};