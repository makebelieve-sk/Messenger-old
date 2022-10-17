import singletonRouter from "next/router";
import { ReactWrapper, ShallowWrapper } from "enzyme";
import MenuComponent from "../../../components/menu";
import { Pages, TestMethods } from "../../../config/enums";
import { setUp } from "../../../jest.setup";

describe("Check MenuComponent render", () => {
    let component: ReactWrapper | ShallowWrapper;

    beforeEach(() => {
        component = setUp(TestMethods.mount, <MenuComponent />);
    });

    it("should containt #menu-container wrapper", () => {
        expect(component).toMatchSnapshot();
    });

    it("should render MenuComponent", () => {
        const wrapper = component.find("#menu-container");

        expect(wrapper.length).toBe(1);
    });

    it("should containt 3 MenuItem in MenuList", () => {
        const wrapper = component.find("ul");
        expect(wrapper.children().length).toBe(3);
    });

    it("after click on 'Профиль' Router should called with Pages.profile parameter", () => {
        const wrapper = component.find("li").at(0);
        wrapper.simulate("click");
        expect(singletonRouter).toMatchObject({
            asPath: Pages.profile,
        });
    });
});