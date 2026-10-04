import {ssrSmoke} from "@peakui/testing/helpers";

import {Button} from "@/components/button";
import {Modal} from "@/components/modal";

describe("Modal SSR", () => {
  it("рендерится без расхождения гидратации в закрытом состоянии", async () => {
    await ssrSmoke(
      <Modal>
        <Button>Открыть</Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Заголовок</Modal.Heading>
              </Modal.Header>
              <Modal.Body>Содержимое</Modal.Body>
              <Modal.Footer>
                <Button slot="close">Продолжить</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>,
    );
  });

  it("рендерится без расхождения гидратации при defaultOpen", async () => {
    await ssrSmoke(
      <Modal defaultOpen>
        <Button>Открыть</Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Heading>Заголовок</Modal.Heading>
              <p>Содержимое</p>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>,
    );
  });
});
