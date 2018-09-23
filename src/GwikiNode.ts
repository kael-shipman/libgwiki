import { Observable } from "./Observable";
import { ObservableInterface } from "./Types";

class _GwikiNode {
}

export const GwikiNode = Observable(_GwikiNode);
export type GwikiNodeInterface = _GwikiNode & ObservableInterface;
